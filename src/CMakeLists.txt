
project(nexus)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(Boost_USE_STATIC_LIBS ON)
set(Boost_USE_MULTITHREADED ON)

find_package(Boost 1.62 COMPONENTS program_options system thread regex filesystem coroutine context iostreams REQUIRED)
find_package(ICU REQUIRED)
find_package(CURL REQUIRED)

if (MSVC)
  # Force to always compile with W4
  if (CMAKE_CXX_FLAGS MATCHES "/W[0-4]")
    string(REGEX REPLACE "/W[0-4]" "/W4" CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}")
  else ()
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /W4")
  endif ()
elseif (CMAKE_COMPILER_IS_GNUCC OR CMAKE_COMPILER_IS_GNUCXX)
  # Update if necessary
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall")
  set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -O3")
  option(BUILD_PROFILING "Build with gprof profiling" OFF)
  if(BUILD_PROFILING)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS_RELEASE} -pg")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -pg")
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -pg")
  endif(BUILD_PROFILING)
endif ()

add_definitions("-DNEXUS_VERSION=\"${NEXUS_VERSION}\"")

include(WebKitCommon)
include(WebKitCompilerFlags)

# Use ld.gold if it is available and isn't disabled explicitly
CMAKE_DEPENDENT_OPTION(USE_LD_GOLD "Use GNU gold linker" ON
    "NOT CXX_ACCEPTS_MFIX_CORTEX_A53_835769;NOT ARM_TRADITIONAL_DETECTED;NOT WIN32;NOT APPLE" OFF)
if (USE_LD_GOLD)
  execute_process(COMMAND ${CMAKE_C_COMPILER} -fuse-ld=gold -Wl,--version ERROR_QUIET OUTPUT_VARIABLE LD_VERSION)
  if ("${LD_VERSION}" MATCHES "GNU gold")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -fuse-ld=gold -Wl,--disable-new-dtags")
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -fuse-ld=gold -Wl,--disable-new-dtags")
  else ()
    message(WARNING "GNU gold linker isn't available, using the default system linker.")
    set(USE_LD_GOLD OFF)
  endif ()
endif ()

add_subdirectory(js)

set(INCLUDES
    ${CMAKE_SOURCE_DIR}/include/nexus.h
    ${CMAKE_SOURCE_DIR}/include/context.h
    ${CMAKE_SOURCE_DIR}/include/object.h
    ${CMAKE_SOURCE_DIR}/include/scheduler.h
    ${CMAKE_SOURCE_DIR}/include/scoped_context.h
    ${CMAKE_SOURCE_DIR}/include/scoped_string.h
    ${CMAKE_SOURCE_DIR}/include/task.h
    ${CMAKE_SOURCE_DIR}/include/util.h
    ${CMAKE_SOURCE_DIR}/include/value.h
    ${CMAKE_SOURCE_DIR}/include/globals/promise.h
    ${CMAKE_SOURCE_DIR}/include/globals/console.h
    ${CMAKE_SOURCE_DIR}/include/globals/context.h
    ${CMAKE_SOURCE_DIR}/include/globals/filesystem.h
    ${CMAKE_SOURCE_DIR}/include/globals/global.h
    ${CMAKE_SOURCE_DIR}/include/globals/io.h
    ${CMAKE_SOURCE_DIR}/include/globals/loader.h
    ${CMAKE_SOURCE_DIR}/include/globals/module.h
    ${CMAKE_SOURCE_DIR}/include/globals/net.h
    ${CMAKE_SOURCE_DIR}/include/globals/scheduler.h
    ${CMAKE_SOURCE_DIR}/include/classes/task.h
    ${CMAKE_SOURCE_DIR}/include/classes/context.h
    ${CMAKE_SOURCE_DIR}/include/classes/base.h
    ${CMAKE_SOURCE_DIR}/include/classes/emitter.h
    ${CMAKE_SOURCE_DIR}/include/classes/io/device.h
    ${CMAKE_SOURCE_DIR}/include/classes/io/filter.h
    ${CMAKE_SOURCE_DIR}/include/classes/io/stream.h
    ${CMAKE_SOURCE_DIR}/include/classes/io/devices/file.h
    ${CMAKE_SOURCE_DIR}/include/classes/io/devices/socket.h
    ${CMAKE_SOURCE_DIR}/include/classes/io/filters/encoding.h
    ${CMAKE_SOURCE_DIR}/include/classes/io/filters/utf8stringfilter.h
    ${CMAKE_SOURCE_DIR}/include/classes/net/tcp/acceptor.h
    ${CMAKE_SOURCE_DIR}/include/classes/net/htcommon/connection.h
    ${CMAKE_SOURCE_DIR}/include/classes/net/htcommon/request.h
    ${CMAKE_SOURCE_DIR}/include/classes/net/htcommon/response.h
    ${CMAKE_SOURCE_DIR}/include/classes/net/http/connection.h
    ${CMAKE_SOURCE_DIR}/include/classes/net/http/request.h
    ${CMAKE_SOURCE_DIR}/include/classes/net/http/response.h
    ${CMAKE_SOURCE_DIR}/include/classes/net/http/server.h
    ${CMAKE_SOURCE_DIR}/include/classes/net/http2/server.h
    ${CMAKE_SOURCE_DIR}/include/exception.h
    ${CMAKE_SOURCE_DIR}/include/global_object.h)

add_executable(nexus ${INCLUDES}
    main.cpp
    global_object.cpp
    nexus.cpp
    scheduler.cpp
    task.cpp
    object.cpp
    value.cpp
    context.cpp
    util.cpp
    exception.cpp
    globals/global.cpp
    globals/console.cpp
    globals/scheduler.cpp
    globals/promise.cpp
    globals/module.cpp
    globals/loader.cpp
    globals/filesystem.cpp
    globals/context.cpp
    globals/io.cpp
    globals/net.cpp
    classes/io/stream.cpp
    classes/io/filter.cpp
    classes/io/device.cpp
    classes/io/devices/file.cpp
    classes/io/devices/socket.cpp
    classes/io/filters/encoding.cpp
    classes/io/filters/utf8stringfilter.cpp
    classes/net/tcp/acceptor.cpp
    classes/net/http/server.cpp
    classes/net/http/request.cpp
    classes/net/http/response.cpp
    classes/net/http/connection.cpp
    classes/net/http2/server.cpp
    classes/net/htcommon/connection.cpp
    classes/net/htcommon/request.cpp
    classes/net/htcommon/response.cpp
    classes/context.cpp
    classes/emitter.cpp
    classes/task.cpp
    classes/base.cpp
    )

add_dependencies(nexus webkit-build)

target_link_libraries(nexus js_bundle JavaScriptCore WTF bmalloc ${Boost_LIBRARIES} ${ICU_LIBRARIES}
    ${ICU_I18N_LIBRARIES} ${CURL_LIBRARIES} pthread)
target_include_directories(nexus
    PRIVATE ${CMAKE_SOURCE_DIR}/include ${CMAKE_BINARY_DIR}/generated/ ${CURL_INCLUDE_DIRS}
    SYSTEM ${JAVASCRIPTCORE_INCLUDE_DIR} ${BOOST_INCLUDE_DIR} ${ICU_INCLUDE_DIR} ${BEAST_INCLUDE_DIR})

link_directories(${Boost_LIBRARY_DIRS})

install(TARGETS nexus RUNTIME DESTINATION bin)

